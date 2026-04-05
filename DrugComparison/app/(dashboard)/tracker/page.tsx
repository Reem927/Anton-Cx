import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, RefreshCw, Calendar, ArrowUp, ArrowDown, Minus } from "lucide-react"

export default function TrackerPage() {
  const updates = [
    {
      drug: "Ozempic",
      company: "UnitedHealthcare",
      change: "Tier Change",
      from: "Tier 3",
      to: "Tier 2",
      direction: "down" as const,
      time: "2 min ago",
      impact: "Positive",
    },
    {
      drug: "Jardiance",
      company: "Aetna",
      change: "Prior Auth Added",
      from: "Not Required",
      to: "Required",
      direction: "up" as const,
      time: "15 min ago",
      impact: "Negative",
    },
    {
      drug: "Eliquis",
      company: "Cigna",
      change: "Quantity Limit",
      from: "90 day supply",
      to: "60 day supply",
      direction: "down" as const,
      time: "1 hour ago",
      impact: "Negative",
    },
    {
      drug: "Lipitor",
      company: "Blue Cross",
      change: "Coverage Update",
      from: "Step Therapy",
      to: "Covered",
      direction: "neutral" as const,
      time: "2 hours ago",
      impact: "Positive",
    },
  ]

  const getDirectionIcon = (direction: "up" | "down" | "neutral") => {
    switch (direction) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-destructive" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-chart-2" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Change Tracker
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time policy updates and changes
          </p>
        </div>
        <Badge variant="outline" className="gap-2 px-3 py-1">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Live Updates
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizations Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">38</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Drugs Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,247</div>
          </CardContent>
        </Card>
      </div>

      {/* Updates Feed */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Recent Changes
          </CardTitle>
          <CardDescription>Policy updates from tracked organizations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {updates.map((update, index) => (
              <div
                key={index}
                className="flex items-start justify-between rounded-lg border border-border/50 bg-background/50 p-4"
              >
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {getDirectionIcon(update.direction)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{update.drug}</span>
                      <Badge
                        variant="outline"
                        className={
                          update.impact === "Positive"
                            ? "border-chart-2/30 text-chart-2"
                            : "border-destructive/30 text-destructive"
                        }
                      >
                        {update.impact}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">{update.company}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground">{update.change}:</span>
                      <span className="text-muted-foreground line-through">{update.from}</span>
                      <span className="text-foreground">{update.to}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {update.time}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
