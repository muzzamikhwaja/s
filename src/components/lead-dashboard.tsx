'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Flame, // Hot
  TrendingUp, // Warm
  Snowflake, // Cold
  Phone,
  RefreshCw, // Re-nurture
  Loader2,
} from 'lucide-react';
import type { Lead } from '@/services/crm';
import type { CategorizeLeadsOutput } from '@/ai/flows/lead-scoring';
import { handleCallLeadAction, handleReNurtureLeadAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";

interface LeadDashboardProps {
  leads: Lead[];
  categorizedLeads: CategorizeLeadsOutput['categorizedLeads'];
}

interface CombinedLead extends Lead {
  category: 'hot' | 'warm' | 'cold';
  reason: string;
}

type LeadActionState = {
  [leadId: string]: {
    isCalling?: boolean;
    isReNurturing?: boolean;
  };
};

export function LeadDashboard({ leads, categorizedLeads }: LeadDashboardProps) {
  const { toast } = useToast();
  const [actionState, setActionState] = React.useState<LeadActionState>({});

  const combinedLeads = React.useMemo(() => {
    const categoryMap = new Map(categorizedLeads.map(cl => [cl.id, { category: cl.category, reason: cl.reason }]));
    return leads.map(lead => {
      const categoryInfo = categoryMap.get(lead.id);
      return {
        ...lead,
        category: categoryInfo?.category || 'cold', // Default to cold if not categorized
        reason: categoryInfo?.reason || 'Not categorized',
      };
    }).sort((a, b) => {
      // Sort by category: hot > warm > cold
      const categoryOrder = { hot: 1, warm: 2, cold: 3 };
      return categoryOrder[a.category] - categoryOrder[b.category];
    });
  }, [leads, categorizedLeads]);

  const handleCall = async (lead: CombinedLead) => {
    setActionState(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], isCalling: true } }));
    const result = await handleCallLeadAction(lead.id, lead.phoneNumber);
    toast({
      title: result.success ? 'Call Successful' : 'Call Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setActionState(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], isCalling: false } }));
  };

  const handleReNurture = async (lead: CombinedLead) => {
     setActionState(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], isReNurturing: true } }));
    const result = await handleReNurtureLeadAction(lead.id, lead.phoneNumber);
     toast({
      title: result.success ? 'Re-Nurture Started' : 'Re-Nurture Failed',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setActionState(prev => ({ ...prev, [lead.id]: { ...prev[lead.id], isReNurturing: false } }));
  };

  const getCategoryBadge = (category: 'hot' | 'warm' | 'cold') => {
    switch (category) {
      case 'hot':
        return (
          <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white">
            <Flame className="mr-1 h-4 w-4" /> Hot
          </Badge>
        );
      case 'warm':
        return (
          <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-black">
            <TrendingUp className="mr-1 h-4 w-4" /> Warm
          </Badge>
        );
      case 'cold':
        return (
          <Badge variant="outline" className="bg-blue-500 hover:bg-blue-600 text-white border-blue-700">
            <Snowflake className="mr-1 h-4 w-4" /> Cold
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };


  return (
    <div className="container mx-auto py-10">
       <h1 className="text-3xl font-bold mb-6 text-foreground">Lead Dashboard</h1>
       <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="w-[100px]">Score</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="text-right w-[250px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedLeads.map((lead) => {
              const isCalling = actionState[lead.id]?.isCalling;
              const isReNurturing = actionState[lead.id]?.isReNurturing;
              const isLoading = isCalling || isReNurturing;

              return (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phoneNumber}</TableCell>
                  <TableCell>{lead.engagementScore}</TableCell>
                  <TableCell>{getCategoryBadge(lead.category)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {lead.category === 'hot' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(lead)}
                        disabled={isLoading}
                        className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                      >
                        {isCalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                        Call
                      </Button>
                    )}
                    {lead.category === 'cold' && (
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReNurture(lead)}
                        disabled={isLoading}
                        className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                         {isReNurturing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Re-Nurture
                      </Button>
                    )}
                     {lead.category === 'warm' && (
                       <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(lead)}
                        disabled={isLoading}
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-500 hover:text-black"
                      >
                        {isCalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
                        Call
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
             {combinedLeads.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No leads found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
