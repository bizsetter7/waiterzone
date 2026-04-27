const HIGHLIGHTERS = [
    { id: 1, color: '#ccff00' },
    { id: 2, color: '#00ff00' },
    { id: 3, color: '#00ffff' },
    { id: 4, color: '#cc99ff' },
    { id: 5, color: '#ffcc00' },
    { id: 6, color: '#99ccff' },
    { id: 7, color: '#ff99ff' },
    { id: 8, color: '#ff00ff' },
    { id: 9, color: 'rainbow' },
    { id: 10, color: 'blink' },
];

export const getHighlighterStyle = (id: number | string | undefined) => {
    const h = HIGHLIGHTERS.find(item => String(item.id) === String(id));

    if (h?.color === 'rainbow') {
        return {
            background: 'linear-gradient(to right, #ef5350, #f48fb1, #7e57c2, #2196f3, #26c6da, #43a047, #eeff41, #f9a825, #ff5722)',
            backgroundSize: '200% auto',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            animation: 'rainbow-text 3s linear infinite',
            fontWeight: '900',
            padding: '0 4px'
        };
    }

    if (h?.color === 'blink') {
        return {
            backgroundColor: '#ffff00',
            color: '#000',
            padding: '0 4px',
            borderRadius: '2px',
            fontWeight: '900',
            animation: 'blink 1s ease-in-out infinite'
        };
    }

    return h ? { backgroundColor: h.color, color: '#000', padding: '0 4px', borderRadius: '2px' } : {};
};
