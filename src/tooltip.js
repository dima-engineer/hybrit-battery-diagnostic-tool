export function initCanvasTooltip(canvasId, getZones, renderContent) {
    const canvas = document.getElementById(canvasId);
    const tooltip = document.getElementById('chartTooltip');
    canvas.addEventListener('mousemove', e => {
        const mx = e.clientX - canvas.getBoundingClientRect().left;
        const hit = getZones().find(z => mx >= z.x && mx <= z.x + z.w);
        if (hit) {
            tooltip.innerHTML = renderContent(hit);
            tooltip.style.display = 'block';
            tooltip.style.left = `${e.clientX + 14}px`;
            tooltip.style.top = `${e.clientY - 8}px`;
        }
        else {
            tooltip.style.display = 'none';
        }
    });
    canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
}
