// Export utilities for dashboard
export const exportDashboardAsPNG = async (elementId: string, filename: string = 'dashboard.png') => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Element not found');
    return;
  }

  try {
    // Use html2canvas-like approach but manually
    // Create a canvas and draw the element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Get element dimensions
    const rect = element.getBoundingClientRect();
    canvas.width = rect.width * 2; // 2x for better quality
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Draw white background
    ctx.fillStyle = '#0a0e14';
    ctx.fillRect(0, 0, rect.width, rect.height);

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
