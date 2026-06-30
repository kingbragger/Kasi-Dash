import { useParams, useLocation } from "wouter";
import { useGetSystem, useUpdateSystem, useDeleteSystem, getGetSystemQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Play, Plus, GripVertical, Settings, Trash, Table2, LayoutDashboard, BarChart2, Shield, FormInput } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion, Reorder } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function BuildForgeSystem() {
  const { id } = useParams<{ id: string }>();
  const systemId = parseInt(id || "0", 10);
  
  const { data, isLoading } = useGetSystem(systemId, { 
    query: { queryKey: getGetSystemQueryKey(systemId), enabled: !!systemId } 
  });
  
  const updateSystem = useUpdateSystem();
  const deleteSystem = useDeleteSystem();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [orderedModules, setOrderedModules] = useState<any[]>([]);
  
  // Sync modules when data loads
  useState(() => {
    if (data?.modules && orderedModules.length === 0) {
      setOrderedModules([...data.modules].sort((a, b) => a.sortOrder - b.sortOrder));
    }
  });

  const handleStatusToggle = () => {
    if (!data) return;
    const newStatus = data.system.status === 'active' ? 'draft' : 'active';
    updateSystem.mutate({ id: systemId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: `System marked as ${newStatus}` });
        queryClient.invalidateQueries({ queryKey: getGetSystemQueryKey(systemId) });
      }
    });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this entire system?")) {
      deleteSystem.mutate({ id: systemId }, {
        onSuccess: () => {
          toast({ title: "System deleted" });
          setLocation("/buildforge");
        }
      });
    }
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case 'table': return <Table2 className="w-4 h-4" />;
      case 'form': return <FormInput className="w-4 h-4" />;
      case 'dashboard': return <LayoutDashboard className="w-4 h-4" />;
      case 'chart': return <BarChart2 className="w-4 h-4" />;
      case 'permissions': return <Shield className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-12 w-64 mb-8" /><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div>System not found</div>;

  const { system } = data;
  const modules = orderedModules.length > 0 ? orderedModules : data.modules;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Link href="/buildforge">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{system.name}</h1>
              <Badge variant={system.status === 'active' ? 'default' : 'secondary'}>{system.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{system.description || "Custom internal tool"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleDelete}>
            <Trash className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleStatusToggle}>
            {system.status === 'active' ? 'Unpublish' : <><Play className="w-4 h-4 mr-2" /> Publish</>}
          </Button>
          <Button><Save className="w-4 h-4 mr-2" /> Save Changes</Button>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Module Builder */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>System Layout</CardTitle>
                <CardDescription>Drag and drop modules to construct your interface.</CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Module
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Table2 className="w-4 h-4 mr-2" /> Data Table</DropdownMenuItem>
                  <DropdownMenuItem><FormInput className="w-4 h-4 mr-2" /> Input Form</DropdownMenuItem>
                  <DropdownMenuItem><BarChart2 className="w-4 h-4 mr-2" /> Metric Chart</DropdownMenuItem>
                  <DropdownMenuItem><Shield className="w-4 h-4 mr-2" /> Access Control</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-lg text-muted-foreground">
                  No modules added yet. Add a module to start building.
                </div>
              ) : (
                <Reorder.Group axis="y" values={modules} onReorder={setOrderedModules} className="space-y-3">
                  {modules.map((mod) => (
                    <Reorder.Item key={mod.id} value={mod}>
                      <motion.div 
                        className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary/50 transition-colors bg-background"
                        whileDrag={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.1)", zIndex: 50 }}
                      >
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                          {getModuleIcon(mod.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{mod.name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{mod.type} Module</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon"><Settings className="w-4 h-4 text-muted-foreground" /></Button>
                          <Button variant="ghost" size="icon"><Trash className="w-4 h-4 text-muted-foreground" /></Button>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground block mb-1">System ID</span>
                <span className="font-mono">{system.id}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground block mb-1">Type</span>
                <span className="capitalize">{system.type}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground block mb-1">Created</span>
                <span>{formatDate(system.createdAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
