"use client";

import { useState } from "react";

interface FloatingActionButtonProps {
  onManualClick: () => void;
  onVoiceClick: () => void;
  onReceiptClick: () => void;
  onEmailClick: () => void;
}

export default function FloatingActionButton({
  onManualClick,
  onVoiceClick,
  onReceiptClick,
  onEmailClick,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      id: "manual",
      label: "Add transaction",
      onClick: onManualClick,
      className: "from-apple-gray-800 to-apple-gray-900",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v12m6-6H6"
        />
      ),
      x: 0,
      y: -110,
    },
    {
      id: "voice",
      label: "Voice input",
      onClick: onVoiceClick,
      className: "from-purple-600 to-purple-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      ),
      x: -78,
      y: -78,
    },
    {
      id: "receipt",
      label: "Upload receipt",
      onClick: onReceiptClick,
      className: "from-blue-600 to-blue-700",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
      x: -110,
      y: 0,
    },
    {
      id: "email",
      label: "Import from Gmail",
      onClick: onEmailClick,
      className: "from-apple-gray-700 to-apple-gray-900",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8m-2 10H5a2 2 0 01-2-2V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2z"
        />
      ),
      x: -78,
      y: 78,
    },
  ] as const;

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="fixed bottom-20 right-8 z-50">
      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/10 backdrop-blur-[1px]"
          aria-label="Close actions"
        />
      )}

      <div className="relative w-16 h-16">
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.onClick)}
            className={`fab-tap absolute bottom-1 right-1 w-11 h-11 bg-gradient-to-br ${action.className} text-white rounded-full shadow-card hover:shadow-card-hover flex items-center justify-center`}
            style={{
              transform: isOpen
                ? `translate(${action.x}px, ${action.y}px) scale(1)`
                : "translate(0px, 0px) scale(0.85)",
              opacity: isOpen ? 1 : 0,
              pointerEvents: isOpen ? "auto" : "none",
              transition:
                "transform 260ms ease-in-out, opacity 220ms ease-in-out",
              transitionDelay: isOpen
                ? `${index * 35}ms`
                : `${(actions.length - 1 - index) * 20}ms`,
            }}
            aria-label={action.label}
            title={action.label}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {action.icon}
            </svg>
          </button>
        ))}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="fab-tap absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-br from-apple-gray-800 to-apple-gray-900 text-white rounded-full shadow-card hover:shadow-card-hover flex items-center justify-center"
          aria-label="Toggle quick actions"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{
              transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
              transition: "transform 240ms ease-in-out",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v12m6-6H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
