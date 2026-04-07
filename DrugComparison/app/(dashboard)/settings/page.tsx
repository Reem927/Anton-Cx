import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Key, Database, Bell, Shield } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your application settings and integrations
        </p>
      </div>

      {/* API Configuration */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Configuration
          </CardTitle>
          <CardDescription>Manage your API keys and integrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">AI</span>
              </div>
              <div>
                <div className="font-medium text-foreground">Claude API</div>
                <div className="text-sm text-muted-foreground">
                  Anthropic Claude for policy analysis
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-chart-2/30 text-chart-2">
                Connected
              </Badge>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Database className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="font-medium text-foreground">Policy Database</div>
                <div className="text-sm text-muted-foreground">
                  External policy data source
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-chart-2/30 text-chart-2">
                Connected
              </Badge>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { title: "Policy Updates", desc: "Get notified when policies change" },
            { title: "New Coverage", desc: "Alert when new drugs are covered" },
            { title: "Tier Changes", desc: "Notify on formulary tier changes" },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4"
            >
              <div>
                <div className="font-medium text-foreground">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </CardTitle>
          <CardDescription>Account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
            <div>
              <div className="font-medium text-foreground">Two-Factor Authentication</div>
              <div className="text-sm text-muted-foreground">
                Add an extra layer of security
              </div>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
            <div>
              <div className="font-medium text-foreground">Change Password</div>
              <div className="text-sm text-muted-foreground">
                Update your account password
              </div>
            </div>
            <Button variant="outline" size="sm">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
