/**
 * Chart.js Global Registry Setup
 * Import this file once in main.tsx to register all Chart.js components
 */
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Set global defaults for better dark mode support
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;
