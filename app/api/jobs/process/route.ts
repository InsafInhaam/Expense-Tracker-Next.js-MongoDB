import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import { getPendingJobs, updateJobStatus } from "@/lib/jobQueue";
import { recordAIUsage } from "@/lib/aiRateLimiter";

// Simple in-memory processor to handle jobs
async function processParseTransactionJob(
  jobData: any,
): Promise<{ result: any; tokensUsed: number }> {
  const { text } = jobData;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Parse transaction: "${text}". Return compact JSON: {"type":"expense"|"income","amount":number,"category":"category","date":"YYYY-MM-DD","note":"text"}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 256,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const error = await geminiResponse.text();
    throw new Error(`Gemini API failed: ${error}`);
  }

  const data = await geminiResponse.json();
  const text_ = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const tokens = data.usageMetadata?.totalTokenCount || 100;

  if (!text_) throw new Error("No response from Gemini");

  let parsed;
  try {
    parsed = JSON.parse(text_);
  } catch {
    const match = text_.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0].replace(/\\"/g, '"'));
    } else {
      throw new Error("Could not parse Gemini response");
    }
  }

  return { result: parsed, tokensUsed: tokens };
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.CRON_SECRET || "default-cron-key";

    if (authHeader !== `Bearer ${expectedKey}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const pendingJobs = await getPendingJobs(5); // Process max 5 jobs per run

    if (pendingJobs.length === 0) {
      return NextResponse.json({ processed: 0, message: "No pending jobs" });
    }

    const results = [];

    for (const job of pendingJobs) {
      try {
        await updateJobStatus(job._id, "processing");

        let result: any;
        let tokensUsed = 0;

        switch (job.type) {
          case "parse_transaction":
            const parseResult = await processParseTransactionJob(job.data);
            result = parseResult.result;
            tokensUsed = parseResult.tokensUsed;
            break;

          // Add other job types here as needed

          default:
            throw new Error(`Unknown job type: ${job.type}`);
        }

        // Record usage
        await recordAIUsage(job.userEmail, tokensUsed);

        // Save result
        await updateJobStatus(job._id, "completed", { result, tokensUsed });

        results.push({
          jobId: job._id,
          status: "completed",
          tokensUsed,
        });
      } catch (error) {
        console.error(`Error processing job ${job._id}:`, error);

        await updateJobStatus(job._id, "failed", {
          error: error instanceof Error ? error.message : String(error),
        });

        results.push({
          jobId: job._id,
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Job processor error:", error);
    return NextResponse.json(
      { error: "Job processing failed" },
      { status: 500 },
    );
  }
}
