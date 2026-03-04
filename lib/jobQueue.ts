import connectToDatabase from "@/lib/mongodb";
import Job, { JobType, JobStatus } from "@/models/Job";

export interface CreateJobParams {
  userId: string;
  userEmail: string;
  type: JobType;
  data: Record<string, any>;
}

export async function createJob(params: CreateJobParams): Promise<string> {
  try {
    await connectToDatabase();

    const job = new Job({
      userId: params.userId,
      userEmail: params.userEmail,
      type: params.type,
      status: "pending",
      data: params.data,
    });

    await job.save();
    return job._id.toString();
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  update: {
    result?: Record<string, any>;
    error?: string;
    tokensUsed?: number;
  } = {},
): Promise<void> {
  try {
    await connectToDatabase();

    const updateData: any = { status };
    if (update.result) updateData.result = update.result;
    if (update.error) updateData.error = update.error;
    if (update.tokensUsed) updateData.tokensUsed = update.tokensUsed;

    if (status === "completed" || status === "failed") {
      updateData.completedAt = new Date();
    }

    await Job.findByIdAndUpdate(jobId, updateData);
  } catch (error) {
    console.error("Error updating job:", error);
  }
}

export async function getJob(jobId: string): Promise<any> {
  try {
    await connectToDatabase();
    return await Job.findById(jobId);
  } catch (error) {
    console.error("Error getting job:", error);
    return null;
  }
}

export async function getPendingJobs(limit: number = 10): Promise<any[]> {
  try {
    await connectToDatabase();
    return await Job.find({ status: "pending" })
      .sort({ createdAt: 1 })
      .limit(limit);
  } catch (error) {
    console.error("Error getting pending jobs:", error);
    return [];
  }
}

export async function getUserJobs(
  userEmail: string,
  limit: number = 50,
): Promise<any[]> {
  try {
    await connectToDatabase();
    return await Job.find({ userEmail }).sort({ createdAt: -1 }).limit(limit);
  } catch (error) {
    console.error("Error getting user jobs:", error);
    return [];
  }
}

export async function deleteExpiredJobs(daysOld: number = 7): Promise<number> {
  try {
    await connectToDatabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await Job.deleteMany({
      completedAt: { $lt: cutoffDate },
    });

    return result.deletedCount || 0;
  } catch (error) {
    console.error("Error deleting expired jobs:", error);
    return 0;
  }
}
