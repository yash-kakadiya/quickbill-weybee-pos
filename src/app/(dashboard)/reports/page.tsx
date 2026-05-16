'use client';

import { useState } from 'react';
import { getReportData } from '@/actions/report.actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  async function handleExport(type: string, filename: string) {
    setIsExporting(type);
    try {
      const result = await getReportData(type);
      
      if (result.success && result.data) {
        if (result.data.length === 0) {
          toast.info('No data available to export for this report.');
          setIsExporting(null);
          return;
        }
        
        try {
          const worksheet = XLSX.utils.json_to_sheet(result.data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
          
          // Generate buffer
          const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
          const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
          
          // Create download link
          const downloadUrl = window.URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
          document.body.appendChild(link);
          link.click();
          
          // Cleanup
          document.body.removeChild(link);
          setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 200);
          
          toast.success('Export completed!');
        } catch (xlsxErr: any) {
          console.error("XLSX Error:", xlsxErr);
          toast.error(`XLSX Error: ${xlsxErr.message || 'Unknown error'}`);
        }
      } else {
        toast.error(result.error || 'Failed to generate report');
      }
    } catch (globalErr: any) {
      console.error("Global Error:", globalErr);
      toast.error(`Global Error: ${globalErr.message}`);
    }
    setIsExporting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Exports</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Report</CardTitle>
            <CardDescription>Export completed orders for the last 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handleExport('daily_sales', 'Sales_Report')}
              disabled={isExporting === 'daily_sales'}
            >
              {isExporting === 'daily_sales' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Export XLSX
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Complete Inventory</CardTitle>
            <CardDescription>Export all products and current stock levels.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => handleExport('inventory', 'Inventory_Report')}
              disabled={isExporting === 'inventory'}
            >
              {isExporting === 'inventory' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Export XLSX
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Export products that are currently below threshold.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              variant="destructive"
              onClick={() => handleExport('low_stock', 'Low_Stock_Report')}
              disabled={isExporting === 'low_stock'}
            >
              {isExporting === 'low_stock' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
              Export XLSX
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
