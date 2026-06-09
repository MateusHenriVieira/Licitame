"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"

export function NavigationProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(10), 100)
    const timer2 = setTimeout(() => setProgress(30), 200)
    const timer3 = setTimeout(() => setProgress(50), 400)
    const timer4 = setTimeout(() => setProgress(70), 600)
    const timer5 = setTimeout(() => setProgress(90), 800)
    const timer6 = setTimeout(() => setProgress(100), 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
      clearTimeout(timer6)
    }
  }, [])

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <Progress value={progress} className="h-1 rounded-none" />
    </div>
  )
}
