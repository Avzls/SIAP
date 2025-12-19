/**
 * Utility function to download file from blob response
 * Usage:
 * 
 * import { downloadFile } from '@/lib/utils';
 * 
 * const handleExport = async (format: 'excel' | 'pdf') => {
 *   try {
 *     const response = await reportsApi.exportAssetsSummary({ category_id: 1 }, format);
 *     const filename = format === 'excel' 
 *       ? `assets-summary-${new Date().toISOString().split('T')[0]}.csv`
 *       : `assets-summary-${new Date().toISOString().split('T')[0]}.html`;
 *     downloadFile(response.data, filename);
 *     toast.success('Report exported successfully');
 *   } catch (error) {
 *     toast.error('Failed to export report');
 *   }
 * };
 */

/**
 * Download a file from blob data
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Export helper for reports
 */
export async function exportReport(
  exportFn: (params: any, format: 'excel' | 'pdf') => Promise<any>,
  params: Record<string, unknown>,
  format: 'excel' | 'pdf',
  reportName: string
) {
  try {
    const response = await exportFn(params, format);
    const extension = format === 'excel' ? 'csv' : 'html';
    const filename = `${reportName}-${new Date().toISOString().split('T')[0]}.${extension}`;
    downloadFile(response.data, filename);
    return { success: true };
  } catch (error) {
    console.error('Export failed:', error);
    return { success: false, error };
  }
}
