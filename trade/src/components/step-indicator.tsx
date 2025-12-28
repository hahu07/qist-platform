"use client";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; description?: string }>;
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div 
      className="bg-white dark:bg-neutral-900 border-b-2 border-neutral-200 dark:border-neutral-800 sticky top-0 z-40"
      role="region"
      aria-label="Application progress"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: Compact Step Counter */}
        <div className="md:hidden text-center mb-4">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400" aria-live="polite">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">
            {steps[currentStep - 1]?.label}
          </p>
        </div>

        {/* Desktop: Full Progress Bar */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400" aria-live="polite">
                Step {currentStep} of {totalSteps}
              </p>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {steps[currentStep - 1]?.label}
              </h2>
              {steps[currentStep - 1]?.description && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {steps[currentStep - 1].description}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div 
                  className="w-32 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={currentStep}
                  aria-valuemin={1}
                  aria-valuemax={totalSteps}
                  aria-label={`Step ${currentStep} of ${totalSteps}: ${steps[currentStep - 1]?.label}`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400" aria-label={`${Math.round((currentStep / totalSteps) * 100)} percent complete`}>
                  {Math.round((currentStep / totalSteps) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Step Dots */}
          <div className="flex items-center">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              const isFuture = stepNumber > currentStep;

              return (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Step Circle */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                        isCompleted
                          ? "bg-success-600 text-white scale-110"
                          : isCurrent
                          ? "bg-primary-600 text-white scale-110 ring-4 ring-primary-600/20 animate-pulse"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        stepNumber
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`text-xs mt-2 text-center font-medium transition-colors ${
                        isCompleted || isCurrent
                          ? "text-neutral-900 dark:text-white"
                          : "text-neutral-500 dark:text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all duration-300 ${
                        stepNumber < currentStep
                          ? "bg-success-600"
                          : "bg-neutral-200 dark:bg-neutral-700"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile: Simple Progress Bar */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400 min-w-[3rem] text-right">
              {Math.round((currentStep / totalSteps) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
