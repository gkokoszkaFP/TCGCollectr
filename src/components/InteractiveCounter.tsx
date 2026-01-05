import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface InteractiveCounterProps {
  initialCount?: number;
}

export function InteractiveCounter({ initialCount = 0 }: InteractiveCounterProps) {
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleIncrement = useCallback(() => {
    setCount((prev) => prev + 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleDecrement = useCallback(() => {
    setCount((prev) => prev - 1);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
  }, []);

  const handleReset = useCallback(() => {
    setCount(initialCount);
  }, [initialCount]);

  return (
    <div
      role="region"
      aria-label="Interactive counter demo"
      className="flex flex-col items-center gap-4 bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/10"
    >
      <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
        React Interactive Demo
      </h3>

      <div
        className={`text-5xl font-bold text-white transition-transform duration-300 ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {count}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleDecrement}
          variant="outline"
          className="bg-red-900/50 hover:bg-red-800/60 text-white border-red-700/50"
          aria-label="Decrease counter by one"
        >
          -
        </Button>

        <Button
          onClick={handleReset}
          variant="outline"
          className="bg-gray-900/50 hover:bg-gray-800/60 text-white border-gray-700/50"
          aria-label="Reset counter to initial value"
        >
          Reset
        </Button>

        <Button
          onClick={handleIncrement}
          variant="outline"
          className="bg-green-900/50 hover:bg-green-800/60 text-white border-green-700/50"
          aria-label="Increase counter by one"
        >
          +
        </Button>
      </div>

      <p className="text-sm text-blue-100/70 text-center">This component demonstrates React hooks and Shadcn UI</p>
    </div>
  );
}
