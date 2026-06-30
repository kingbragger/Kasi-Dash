import { useListSystems, useCreateSystem, getListSystemsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Blocks, Plus, LayoutTemplate, Briefcase, FileText, Settings, Users, Truck, Clock } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function BuildForge() {
  const { data: systems, isLoading } = useListSystems({ query: { queryKey: getListSystemsQueryKey() } });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", type: "custom" as any, description: "" });
  
  const createSystem = useCreateSystem();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleCreate = () => {
    if (!formData.name) return;
    
    createSystem.mutate({ data: formData }, {
      onSuccess: (newSystem) => {
        toast({ title: "System created successfully" });
        setIsCreateOpen(false);
        queryClient.invalidateQueries({ queryKey: getListSystemsQueryKey() });
        setLocation(`/buildforge/${newSystem.id}`);
      }
    });
  };

  const getSystemIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <FileText className="w-5 h-5" />;
      case 'employee': return <Users className="w-5 h-5" />;
      case 'crm': return <Briefcase className="w-5 h-5" />;
      case 'delivery': return <Truck className="w-5 h-5" />;
      case 'booking': return <Clock className="w-5 h-5" />;
      case 'stock': return <Blocks className="w-5 h-5" />;
      default: return <LayoutTemplate className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Blocks className="w-8 h-8 text-primary" />
            BuildForge
          </h1>
          <p className="text-muted-foreground">Design custom internal tools and workflows.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> New System
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New System</DialogTitle>
              <DialogDescription>Start building a new internal tool for your business.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">System Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Employee Directory" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Template Type</Label>
                <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Blank (Custom)</SelectItem>
                    <SelectItem value="invoice">Invoice Manager</SelectItem>
                    <SelectItem value="employee">Employee Directory</SelectItem>
                    <SelectItem value="crm">Mini CRM</SelectItem>
                    <SelectItem value="delivery">Delivery Tracker</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (Optional)</Label>
                <Textarea 
                  id="desc" 
                  placeholder="What does this system do?" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.name || createSystem.isPending}>
                Create System
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      ) : systems?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <Blocks className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No systems built yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">Create your first custom workflow tool.</p>
          <Button onClick={() => setIsCreateOpen(true)}>Create System</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {systems?.map(system => (
            <Card key={system.id} className="group hover:border-primary/50 transition-colors flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    {getSystemIcon(system.type)}
                  </div>
                  <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>
                    {system.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{system.name}</CardTitle>
                {system.description && (
                  <CardDescription className="line-clamp-2">{system.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="pb-3 flex-1">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  {system.moduleCount} modules configured
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t border-border flex justify-between items-center bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Updated {format(new Date(system.updatedAt), "MMM d")}
                </span>
                <Link href={`/buildforge/${system.id}`}>
                  <Button variant="secondary" size="sm">Open Builder</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Template Gallery Teaser */}
      <div className="mt-12 pt-8 border-t border-border">
        <h2 className="text-xl font-semibold mb-6">Start from a Template</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <TemplateCard title="Invoice Manager" type="invoice" desc="Track, generate, and manage client invoices." icon={FileText} />
          <TemplateCard title="Employee DB" type="employee" desc="Internal directory and HR management." icon={Users} />
          <TemplateCard title="Mini CRM" type="crm" desc="Track deals and client interactions." icon={Briefcase} />
          <TemplateCard title="Delivery Route" type="delivery" desc="Manage local delivery scheduling." icon={Truck} />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ title, desc, icon: Icon, type }: any) {
  return (
    <Card className="hover:bg-muted/50 cursor-pointer transition-colors border-dashed">
      <CardContent className="p-6">
        <Icon className="w-8 h-8 text-primary/60 mb-4" />
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
