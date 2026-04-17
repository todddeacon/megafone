'use client'

import { useState } from 'react'
import { runHealthCheck, type HealthCheckResult, type TestResult } from './actions'

function StatusIcon({ status }: { status: TestResult['status'] }) {
  if (status === 'pass') return <span className="text-emerald-500">&#10003;</span>
  if (status === 'fail') return <span className="text-red-500">&#10007;</span>
  return <span className="text-gray-400">&#8211;</span>
}

export default function HealthCheckRunner() {
  const [result, setResult] = useState<HealthCheckResult | null>(null)
  const [running, setRunning] = useState(false)

  async function handleRun() {
    setRunning(true)
    setResult(null)
    const res = await runHealthCheck()
    setResult(res)
    setRunning(false)
  }

  const passCount = result?.results.filter((r) => r.status === 'pass').length ?? 0
  const failCount = result?.results.filter((r) => r.status === 'fail').length ?? 0
  const totalCount = result?.results.length ?? 0

  return (
    <div className="space-y-6">
      <button
        onClick={handleRun}
        disabled={running}
        className="w-full rounded-lg bg-[#064E3B] px-6 py-3 text-sm font-semibold text-white hover:bg-[#065F46] disabled:opacity-50 transition-colors"
      >
        {running ? 'Running health check...' : 'Run health check'}
      </button>

      {result && (
        <>
          {/* Summary */}
          <div className={`rounded-xl px-5 py-4 ${
            failCount === 0
              ? 'bg-emerald-50 border border-emerald-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-bold ${failCount === 0 ? 'text-emerald-800' : 'text-red-800'}`}>
                  {failCount === 0 ? 'All checks passed' : `${failCount} check${failCount !== 1 ? 's' : ''} failed`}
                </p>
                <p className={`text-xs mt-0.5 ${failCount === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passCount}/{totalCount} passed in {result.totalMs}ms
                </p>
              </div>
              <div className={`text-3xl font-black ${failCount === 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {failCount === 0 ? '✓' : failCount}
              </div>
            </div>
          </div>

          {/* Individual results */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-100">
              {result.results.map((test, i) => (
                <li key={i} className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={test.status} />
                    <span className="text-sm font-medium text-gray-900 flex-1">{test.name}</span>
                    <span className="text-[10px] text-gray-400 tabular-nums">{test.ms}ms</span>
                  </div>
                  <p className={`text-xs mt-1 ml-6 ${
                    test.status === 'fail' ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {test.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
