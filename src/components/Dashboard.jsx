import React, { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import './Dashboard.css';

// Using maximally distinct color hexes spreading across the hue wheel
const DISTINCT_COLORS = [
    '#ef4444', // Red 500
    '#3b82f6', // Blue 500
    '#f59e0b', // Amber 500
    '#10b981', // Emerald 500
    '#8b5cf6', // Violet 500
    '#06b6d4', // Cyan 500
    '#d946ef', // Fuchsia 500
    '#84cc16', // Lime 500
    '#f97316', // Orange 500
    '#ec4899', // Pink 500
    '#14b8a6', // Teal 500
    '#6366f1'  // Indigo 500
];

export default function Dashboard({ portfolio, allDates }) {
    // Find the latest date to default to
    const latestDate = allDates.length > 0 ? allDates[allDates.length - 1] : null;
    const [selectedDate, setSelectedDate] = useState(latestDate);

    // If latestDate changes, sync
    useEffect(() => {
        if (latestDate && (!selectedDate || !allDates.includes(selectedDate))) {
            setSelectedDate(latestDate);
        }
    }, [latestDate, selectedDate, allDates]);

    // Derive data ONLY for the selected date
    const activePortfolioSnapshot = portfolio.map(asset => {
        const historyPoint = asset.history[selectedDate] || { capital: 0, exposureValue: 0 };
        return {
            ...asset,
            capital: historyPoint.capital,
            exposureValue: historyPoint.exposureValue
        };
    });

    const totalCapital = activePortfolioSnapshot.reduce((sum, asset) => sum + Number(asset.capital), 0);
    const totalExposure = activePortfolioSnapshot.reduce((sum, asset) => sum + Number(asset.exposureValue), 0);

    // 1. Capital by Asset Name
    const capitalByNameData = activePortfolioSnapshot
        .filter(a => Number(a.capital) > 0)
        .map(a => ({ name: a.name, value: Number(a.capital) }))
        .sort((a, b) => b.value - a.value);

    // 2. Exposure by Category
    const exposureByCategoryMap = activePortfolioSnapshot.reduce((acc, curr) => {
        const cat = curr.exposureCategory || 'Other';
        acc[cat] = (acc[cat] || 0) + Number(curr.exposureValue);
        return acc;
    }, {});

    const exposureByCategoryData = Object.entries(exposureByCategoryMap)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 3. Exposure by Type
    const exposureByTypeMap = activePortfolioSnapshot.reduce((acc, curr) => {
        const type = curr.type || 'Other';
        acc[type] = (acc[type] || 0) + Number(curr.exposureValue);
        return acc;
    }, {});

    const exposureByTypeData = Object.entries(exposureByTypeMap)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    // 4. Time-Series Aggregation for Historical Chart
    const historicalData = allDates.map(date => {
        let dayCapital = 0;
        let dayExposure = 0;
        portfolio.forEach(asset => {
            const hist = asset.history[date] || { capital: 0, exposureValue: 0 };
            dayCapital += Number(hist.capital);
            dayExposure += Number(hist.exposureValue);
        });
        return {
            date,
            Capital: dayCapital,
            Exposure: dayExposure
        };
    });

    // Custom tooltips
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label">{payload[0].name}</p>
                    <p className="tooltip-value">
                        ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                </div>
            );
        }
        return null;
    };

    const CustomLineTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <p className="tooltip-label mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex align-center gap-2 mb-1">
                            <span style={{ color: entry.color, fontWeight: 'bold' }}>{entry.name}:</span>
                            <span className="tooltip-value">
                                ${Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <section className="dashboard slide-up">
            <div className="section-header">
                <h2>Portfolio Dashboard</h2>
                <p className="text-secondary">
                    Risk and Allocation Breakdown
                    {selectedDate && <span className="text-primary ml-2"> (Viewing: {selectedDate})</span>}
                </p>
            </div>

            <div className="dashboard-grid glass-panel mb-6">
                <div className="metric">
                    <span className="metric-label">Total Invested Capital</span>
                    <h1 className="metric-value">
                        ${totalCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>

                <div className="metric">
                    <span className="metric-label">Total Notional Exposure</span>
                    <h1 className="metric-value">
                        ${totalExposure.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h1>
                </div>

                <div className="metric">
                    <span className="metric-label">System Leverage Ratio</span>
                    <div className="metric-value-sub text-primary">
                        {totalCapital > 0 ? (totalExposure / totalCapital).toFixed(2) + 'x' : '0.00x'}
                    </div>
                </div>
            </div>

            <div className="pie-charts-grid">
                {/* Chart 1: Capital by Asset */}
                <div className="pie-card glass-panel">
                    <h3 className="chart-title">Capital Allocation (By Asset)</h3>
                    <div className="chart-container">
                        {capitalByNameData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={capitalByNameData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {capitalByNameData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DISTINCT_COLORS[index % DISTINCT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={80}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">No capital data for this date</div>
                        )}
                    </div>
                </div>

                {/* Chart 2: Exposure by Category */}
                <div className="pie-card glass-panel">
                    <h3 className="chart-title">Exposure (By Category)</h3>
                    <div className="chart-container">
                        {exposureByCategoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={exposureByCategoryData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {/* Offset the color array index by 3 to ensure distinct start */}
                                        {exposureByCategoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DISTINCT_COLORS[(index + 3) % DISTINCT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={80}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">No exposure data for this date</div>
                        )}
                    </div>
                </div>

                {/* Chart 3: Exposure by Type */}
                <div className="pie-card glass-panel">
                    <h3 className="chart-title">Exposure (By Type)</h3>
                    <div className="chart-container">
                        {exposureByTypeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={exposureByTypeData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {/* Offset the color array index by 7 to ensure distinct start */}
                                        {exposureByTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={DISTINCT_COLORS[(index + 7) % DISTINCT_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomPieTooltip />} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={80}
                                        iconType="circle"
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="empty-chart">No type data for this date</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Historical Time-Series Chart */}
            <div className="historical-chart-card glass-panel">
                <h3 className="chart-title mb-6 text-left">Capital vs. Exposure Over Time</h3>
                <div className="historical-chart-container">
                    {historicalData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={historicalData}
                                margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExposure" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    stroke="#a0a5b1"
                                    tick={{ fill: '#a0a5b1' }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    stroke="#a0a5b1"
                                    tick={{ fill: '#a0a5b1' }}
                                    tickFormatter={(value) => `$${value}`}
                                />
                                <CartesianGrid strokeDasharray="3 3" stroke="#2d3039" vertical={false} />
                                <Tooltip content={<CustomLineTooltip />} />
                                <Legend verticalAlign="top" height={36} iconType="plainline" />

                                <Area
                                    type="monotone"
                                    dataKey="Exposure"
                                    stroke="#ec4899"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExposure)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="Capital"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCapital)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">No historical data available</div>
                    )}
                </div>
            </div>

        </section>
    );
}
