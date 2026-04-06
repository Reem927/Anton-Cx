import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Clock, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function QAPage() {
  const recentSearches = [
    "What is the prior authorization requirement for Ozempic?",
    "Compare step therapy policies for diabetes medications",
    "Tier 1 coverage for generic statins across all insurers",
    "Quantity limits on controlled substances",
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Q&A Search
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search drug policies and get AI-powered answers
        </p>
      </div>

      {/* Search Box */}
      <Card className="border-border/50 bg-card/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ask a question about drug policies..."
                className="bg-background pl-9 h-12 text-base"
              />
            </div>
            <Button size="lg" className="h-12 px-6">
              Search
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Searches */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Searches
          </CardTitle>
          <CardDescription>Your recent policy queries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                className="flex w-full items-center gap-3 rounded-lg border border-border/50 bg-background/50 p-3 text-left transition-colors hover:bg-muted/50"
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-foreground">{search}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: "Coverage Check", desc: "Verify drug coverage status" },
          { title: "Prior Auth Guide", desc: "PA requirements lookup" },
          { title: "Formulary Search", desc: "Search drug formularies" },
        ].map((action) => (
          <Card
            key={action.title}
            className="cursor-pointer border-border/50 bg-card/50 transition-colors hover:bg-muted/30"
          >
            <CardHeader>
              <CardTitle className="text-base">{action.title}</CardTitle>
              <CardDescription>{action.desc}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
