function getHPColor(pct) {
    if (pct > 50) return '#10b981'; // emerald
    if (pct > 25) return '#f59e0b'; // amber
    return '#ef4444'; // red
}