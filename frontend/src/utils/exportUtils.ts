import html2canvas from 'html2canvas';

// Export utilities for dashboard
export const exportDashboardAsPNG = async (elementId: string, filename: string = 'dashboard.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Render the element into a canvas using html2canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#0a0e14',
      scale: 2,
      useCORS: true,
    });

    // Download the canvas
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
  }
};

export const saveDashboardConfig = (config: any) => {
  const json = JSON.stringify(config, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `dashboard-config-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const loadDashboardConfig = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string);
            resolve(config);
          } catch (error) {
            reject(error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  });
};
