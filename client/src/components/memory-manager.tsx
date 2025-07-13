import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Download, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Memory {
  id: number;
  content: string;
  context?: string;
  importance: number;
  createdAt: string;
}

export function MemoryManager() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/memories');
      if (!response.ok) {
        throw new Error('Failed to load memories');
      }
      const data = await response.json();
      setMemories(data);
    } catch (error) {
      toast({
        title: "Error loading memories",
        description: "Failed to load memory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteMemory = async (memoryId: number) => {
    try {
      setDeleting(memoryId);
      const response = await fetch(`/api/memories/${memoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete memory');
      }
      setMemories(memories.filter(m => m.id !== memoryId));
      toast({
        title: "Memory deleted",
        description: "The memory has been removed successfully"
      });
    } catch (error) {
      toast({
        title: "Error deleting memory",
        description: "Failed to delete the memory",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  const exportMemories = async () => {
    try {
      const response = await fetch('/api/memories/export', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error('Failed to export memories');
      }
      const data = await response.json();
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lumen-memories-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Memories exported",
        description: "Your memories have been exported successfully"
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export memories",
        variant: "destructive"
      });
    }
  };

  const clearAllMemories = async () => {
    if (!confirm('Are you sure you want to delete ALL memories? This cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch('/api/memories', {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to clear memories');
      }
      setMemories([]);
      toast({
        title: "All memories cleared",
        description: "All memories have been deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Clear failed",
        description: "Failed to clear memories",
        variant: "destructive"
      });
    }
  };

  const getImportanceColor = (importance: number) => {
    if (importance > 0.8) return 'bg-red-500';
    if (importance > 0.6) return 'bg-orange-500';
    if (importance > 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getImportanceLabel = (importance: number) => {
    if (importance > 0.8) return 'Critical';
    if (importance > 0.6) return 'High';
    if (importance > 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Memory Management</h2>
          <p className="text-gray-400">Manage Lumen's stored memories and context</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={exportMemories}
            variant="outline"
            className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={clearAllMemories}
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Database className="w-5 h-5" />
            Memory Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{memories.length}</div>
              <div className="text-sm text-gray-400">Total Memories</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {memories.filter(m => m.importance > 0.6).length}
              </div>
              <div className="text-sm text-gray-400">High Importance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {(memories.reduce((sum, m) => sum + m.content.length, 0) / 1024).toFixed(1)}KB
              </div>
              <div className="text-sm text-gray-400">Memory Size</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Stored Memories</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading memories...</div>
            ) : memories.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No memories stored yet</div>
            ) : (
              <div className="space-y-3">
                {memories.map((memory) => (
                  <div
                    key={memory.id}
                    className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            className={`text-xs ${getImportanceColor(memory.importance)} text-white`}
                          >
                            {getImportanceLabel(memory.importance)}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {new Date(memory.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{memory.content}</p>
                        {memory.context && (
                          <p className="text-xs text-gray-500 italic">Context: {memory.context}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMemory(memory.id)}
                        disabled={deleting === memory.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}