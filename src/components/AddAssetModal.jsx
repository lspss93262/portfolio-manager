import React, { useState } from 'react';
import './AddAssetModal.css';

export default function AddAssetModal({ isOpen, onClose, onAdd }) {
    const [ticker, setTicker] = useState('');
    const [name, setName] = useState('');
    const [shares, setShares] = useState('');
    const [avgPrice, setAvgPrice] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!ticker || !shares || !avgPrice) return;

        const newAsset = {
            id: Date.now().toString(),
            ticker: ticker.toUpperCase(),
            name: name || ticker.toUpperCase(),
            shares: parseFloat(shares),
            avgPrice: parseFloat(avgPrice),
            // Mocking current price slightly different from avg price for demo purposes
            currentPrice: parseFloat(avgPrice) * (1 + (Math.random() * 0.1 - 0.03))
        };

        onAdd(newAsset);

        // Reset form
        setTicker('');
        setName('');
        setShares('');
        setAvgPrice('');
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass-panel slide-up">
                <div className="modal-header">
                    <h2>Add New Asset</h2>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="add-asset-form">
                    <div className="form-group relative">
                        <label htmlFor="ticker">Ticker Symbol</label>
                        <input
                            type="text"
                            id="ticker"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value)}
                            placeholder="e.g. AAPL"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="name">Company Name (Optional)</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Apple Inc."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="shares">Number of Shares</label>
                            <input
                                type="number"
                                id="shares"
                                value={shares}
                                onChange={(e) => setShares(e.target.value)}
                                placeholder="0.00"
                                step="0.0001"
                                min="0"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="avgPrice">Average Cost ($)</label>
                            <input
                                type="number"
                                id="avgPrice"
                                value={avgPrice}
                                onChange={(e) => setAvgPrice(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary">Add Asset</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
