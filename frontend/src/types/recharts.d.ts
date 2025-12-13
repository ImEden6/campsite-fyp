/**
 * Type declarations for recharts deep module imports (ES6 paths)
 * These enable cherry-picking individual components for better tree-shaking
 */

// Chart types
declare module 'recharts/es6/chart/LineChart' {
    import { LineChart } from 'recharts';
    export { LineChart };
}

declare module 'recharts/es6/chart/BarChart' {
    import { BarChart } from 'recharts';
    export { BarChart };
}

declare module 'recharts/es6/chart/PieChart' {
    import { PieChart } from 'recharts';
    export { PieChart };
}

// Cartesian components
declare module 'recharts/es6/cartesian/Line' {
    import { Line } from 'recharts';
    export { Line };
}

declare module 'recharts/es6/cartesian/Bar' {
    import { Bar } from 'recharts';
    export { Bar };
}

declare module 'recharts/es6/cartesian/XAxis' {
    import { XAxis } from 'recharts';
    export { XAxis };
}

declare module 'recharts/es6/cartesian/YAxis' {
    import { YAxis } from 'recharts';
    export { YAxis };
}

declare module 'recharts/es6/cartesian/CartesianGrid' {
    import { CartesianGrid } from 'recharts';
    export { CartesianGrid };
}

// Polar components
declare module 'recharts/es6/polar/Pie' {
    import { Pie } from 'recharts';
    export { Pie };
}

// General components
declare module 'recharts/es6/component/Tooltip' {
    import { Tooltip } from 'recharts';
    export { Tooltip };
}

declare module 'recharts/es6/component/Legend' {
    import { Legend } from 'recharts';
    export { Legend };
}

declare module 'recharts/es6/component/ResponsiveContainer' {
    import { ResponsiveContainer } from 'recharts';
    export { ResponsiveContainer };
}

declare module 'recharts/es6/component/Cell' {
    import { Cell } from 'recharts';
    export { Cell };
}
