import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, BarChart3, FileText, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    {
      title: "Total Policies",
      value: "2,847",
      change: "+12%",
      icon: FileText,
    },
    {
      title: "Active Comparisons",
      value: "142",
      change: "+8%",
      icon: BarChart3,
    },
    {
      title: "Organizations",
      value: "38",
      change: "+2",
      icon: Activity,
    },
    {
      title: "Updates Today",
      value: "24",
      change: "+18%",
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of drug policy intelligence and analytics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border/50 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-primary">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest policy updates and comparisons</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Policy updated", drug: "Lipitor", company: "Aetna", time: "2 min ago" },
              { action: "Comparison created", drug: "Metformin", company: "Multiple", time: "15 min ago" },
              { action: "New coverage", drug: "Ozempic", company: "UnitedHealthcare", time: "1 hour ago" },
              { action: "Tier changed", drug: "Jardiance", company: "Cigna", time: "2 hours ago" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{item.action}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.drug} - {item.company}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
