import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center w-full max-w-3xl mx-auto">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-1 flex-1 mx-1" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-1 flex-1 mx-1" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-1 flex-1 mx-1" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-1 flex-1 mx-1" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </CardFooter>
      </Card>
    </div>
  )
}
