import React, { useState } from 'react';
import './AssetList.css';

export default function AssetList({ portfolio, setPortfolio, allDates }) {
    const [newAssetInput, setNewAssetInput] = useState('');
    const [newDateInput, setNewDateInput] = useState('');

    // Edit static asset properties
    const handleEditAssetProperty = (assetId, field, value) => {
        const newPortfolio = portfolio.map(asset => {
            if (asset.id === assetId) {
                return { ...asset, [field]: value };
            }
            return asset;
        });
        setPortfolio(newPortfolio);
    };

    // Edit dynamic history points
    const handleEditHistory = (assetId, date, field, value) => {
        let numValue = parseFloat(value);
        if (isNaN(numValue) && value !== '') return;
        if (value === '') numValue = 0; // fallback

        const newPortfolio = portfolio.map(asset => {
            if (asset.id === assetId) {
                return {
                    ...asset,
                    history: {
                        ...asset.history,
                        [date]: {
                            ...asset.history[date],
                            [field]: numValue
                        }
                    }
                };
            }
            return asset;
        });
        setPortfolio(newPortfolio);
    };

    const handleAddAssetRow = (e) => {
        e.preventDefault();
        if (!newAssetInput.trim()) return;

        // Use latest available date, or today
        const targetDate = allDates.length > 0 ? allDates[allDates.length - 1] : new Date().toISOString().split('T')[0];

        const newAsset = {
            id: Date.now().toString(),
            name: newAssetInput.trim(),
            type: 'Equity',
            exposureCategory: 'General',
            history: {
                [targetDate]: { capital: 0, exposureValue: 0 }
            }
        };

        setPortfolio([...portfolio, newAsset]);
        setNewAssetInput('');
    };

    const handleAddDateColumn = (e) => {
        e.preventDefault();
        if (!newDateInput) return;

        if (allDates.includes(newDateInput)) {
            alert("This date column already exists!");
            return;
        }

        // Add empty history node for that date to all assets so it renders clearly
        const newPortfolio = portfolio.map(asset => ({
            ...asset,
            history: {
                ...asset.history,
                [newDateInput]: { capital: 0, exposureValue: 0 }
            }
        }));

        // If portfolio is empty, we instantiate a placeholder so the column can exist
        if (newPortfolio.length === 0) {
            newPortfolio.push({
                id: Date.now().toString(),
                name: 'Placeholder Asset',
                type: 'Cash',
                exposureCategory: 'None',
                history: {
                    [newDateInput]: { capital: 0, exposureValue: 0 }
                }
            });
        }

        setPortfolio(newPortfolio);
        setNewDateInput('');
    };

    const handleDeleteAsset = (id) => {
        if (confirm(`Are you sure you want to delete this specific asset?`)) {
            setPortfolio(portfolio.filter(a => a.id !== id));
        }
    };

    const handleDeleteDate = (date) => {
        if (confirm(`Delete the entire snapshot column for ${date}?`)) {
            const newPortfolio = portfolio.map(asset => {
                const newHistory = { ...asset.history };
                delete newHistory[date];
                return { ...asset, history: newHistory };
            });
            setPortfolio(newPortfolio);
        }
    };

    return (
        <div className="matrix-container">
            {/* Controls to Add Row/Col */}
            <div className="matrix-controls glass-panel mb-4">
                <form onSubmit={handleAddAssetRow} className="control-group">
                    <input
                        type="text"
                        placeholder="New Asset Name"
                        value={newAssetInput}
                        onChange={(e) => setNewAssetInput(e.target.value)}
                        className="matrix-input"
                    />
                    <button type="submit" className="btn-secondary small">+ Add Asset Row</button>
                </form>

                <form onSubmit={handleAddDateColumn} className="control-group">
                    <input
                        type="date"
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                        className="matrix-input"
                    />
                    <button type="submit" className="btn-secondary small">+ Add Date Column</button>
                </form>
            </div>

            <div className="matrix-wrapper glass-panel">
                <div className="matrix-scroll-area">
                    <table className="asset-matrix complex-matrix">
                        <thead>
                            {/* PRIMARY HEADER: Property Definitions and Date Sets */}
                            <tr>
                                <th className="sticky-col header-cell group-header blank-cell" colSpan={3}>Asset Properties</th>
                                {allDates.map(date => (
                                    <th key={date} className="header-cell group-header date-col" colSpan={2}>
                                        <div className="col-header-content justify-center">
                                            <span>Timeline: {date}</span>
                                            <button
                                                className="btn-icon-micro"
                                                onClick={() => handleDeleteDate(date)}
                                                title="Delete Date Col"
                                            >×</button>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                            {/* SECONDARY HEADER: The specific fields (Capital, Exposure) beneath dates */}
                            <tr>
                                <th className="sticky-col sub-header-cell property-col">Name</th>
                                <th className="sticky-col sub-header-cell property-col left-offset-1">Type</th>
                                <th className="sticky-col sub-header-cell property-col left-offset-2 border-right-strong">Category</th>
                                {allDates.map(date => (
                                    <React.Fragment key={`sub-${date}`}>
                                        <th className="sub-header-cell value-col">Capital ($)</th>
                                        <th className="sub-header-cell value-col border-right-strong">Exposure ($)</th>
                                    </React.Fragment>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {portfolio.length === 0 ? (
                                <tr>
                                    {/* +3 for the static props, +2 for each date */}
                                    <td colSpan={3 + (allDates.length * 2)} className="empty-cell text-center p-4">
                                        <span className="text-secondary">No assets tracked yet. Add an asset row above.</span>
                                    </td>
                                </tr>
                            ) : (
                                portfolio.map(asset => (
                                    <tr key={asset.id} className="matrix-row">
                                        {/* Fixed Properties */}
                                        <td className="sticky-col property-cell">
                                            <div className="row-header-content">
                                                <input
                                                    className="cell-input text-primary font-bold"
                                                    value={asset.name}
                                                    onChange={(e) => handleEditAssetProperty(asset.id, 'name', e.target.value)}
                                                />
                                                <button
                                                    className="btn-icon-micro"
                                                    onClick={() => handleDeleteAsset(asset.id)}
                                                    title="Delete Asset"
                                                >×</button>
                                            </div>
                                        </td>
                                        <td className="sticky-col property-cell left-offset-1">
                                            <input
                                                className="cell-input"
                                                value={asset.type}
                                                onChange={(e) => handleEditAssetProperty(asset.id, 'type', e.target.value)}
                                            />
                                        </td>
                                        <td className="sticky-col property-cell left-offset-2 border-right-strong">
                                            <input
                                                className="cell-input"
                                                value={asset.exposureCategory}
                                                onChange={(e) => handleEditAssetProperty(asset.id, 'exposureCategory', e.target.value)}
                                            />
                                        </td>

                                        {/* Historical Timeline Cells */}
                                        {allDates.map(date => {
                                            const historyPoint = asset.history[date] || { capital: 0, exposureValue: 0 };
                                            return (
                                                <React.Fragment key={`${asset.id}-${date}`}>
                                                    <td className="matrix-cell value-cell">
                                                        <div className="cell-input-wrapper">
                                                            <span className="currency-symbol">$</span>
                                                            <input
                                                                type="number"
                                                                className="cell-input right-align"
                                                                value={historyPoint.capital}
                                                                onChange={(e) => handleEditHistory(asset.id, date, 'capital', e.target.value)}
                                                                placeholder="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="matrix-cell value-cell border-right-strong">
                                                        <div className="cell-input-wrapper">
                                                            <span className="currency-symbol">$</span>
                                                            <input
                                                                type="number"
                                                                className="cell-input right-align"
                                                                value={historyPoint.exposureValue}
                                                                onChange={(e) => handleEditHistory(asset.id, date, 'exposureValue', e.target.value)}
                                                                placeholder="0"
                                                                step="0.01"
                                                            />
                                                        </div>
                                                    </td>
                                                </React.Fragment>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
