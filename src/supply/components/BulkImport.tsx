// @ts-nocheck
"use client";
import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Check, X, Download } from 'lucide-react';
import { Product, Supplier, Warehouse } from '../types';

interface BulkImportProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (products: Omit<Product, 'id'>[]) => void;
    suppliers: Supplier[];
    warehouses: Warehouse[];
}

interface ParsedProduct {
    name: string;
    sku: string;
    barcode: string;
    category: string;
    price: number;
    cost: number;
    stock: number;
    reorderLevel: number;
    supplierId: string;
    warehouseId: string;
    errors: string[];
    isValid: boolean;
}

const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    });
};

const generateSKU = (category: string): string => {
    const prefix = (category || 'GEN').substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${random}-${Date.now().toString().slice(-3)}`;
};

const generateBarcode = (): string => {
    return '890' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
};

export const BulkImport: React.FC<BulkImportProps> = ({
    isOpen,
    onClose,
    onImport,
    suppliers,
    warehouses
}) => {
    const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAndParse = (rows: string[][]): ParsedProduct[] => {
        if (rows.length < 2) return [];

        const headers = rows[0].map(h => h.toLowerCase().trim());
        const dataRows = rows.slice(1);

        return dataRows.map(row => {
            const getValue = (key: string): string => {
                const index = headers.findIndex(h => h.includes(key));
                return index >= 0 ? row[index] || '' : '';
            };

            const name = getValue('name');
            const category = getValue('category') || 'General';
            const priceStr = getValue('price');
            const costStr = getValue('cost');
            const stockStr = getValue('stock');
            const reorderStr = getValue('reorder');
            const supplierName = getValue('supplier');
            const warehouseName = getValue('warehouse');
            const sku = getValue('sku') || generateSKU(category);
            const barcode = getValue('barcode') || generateBarcode();

            const errors: string[] = [];

            if (!name) errors.push('Name is required');

            const price = parseFloat(priceStr) || 0;
            if (price <= 0) errors.push('Invalid price');

            const cost = parseFloat(costStr) || price * 0.6;
            const stock = parseInt(stockStr) || 0;
            const reorderLevel = parseInt(reorderStr) || 10;

            const supplier = suppliers.find(s =>
                s.name.toLowerCase().includes(supplierName.toLowerCase()) || s.id === supplierName
            );
            const warehouse = warehouses.find(w =>
                w.name.toLowerCase().includes(warehouseName.toLowerCase()) || w.id === warehouseName
            );

            return {
                name,
                sku,
                barcode,
                category,
                price,
                cost,
                stock,
                reorderLevel,
                supplierId: supplier?.id || suppliers[0]?.id || '',
                warehouseId: warehouse?.id || '',
                errors,
                isValid: errors.length === 0
            };
        });
    };

    const handleFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = parseCSV(text);
            const parsed = validateAndParse(rows);
            setParsedProducts(parsed);
        };
        reader.readAsText(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.csv')) {
            handleFile(file);
        }
    };

    const handleImport = () => {
        const validProducts = parsedProducts
            .filter(p => p.isValid)
            .map(({ errors, isValid, ...product }) => product);

        onImport(validProducts);
        onClose();
        setParsedProducts([]);
        setFileName('');
    };

    const downloadTemplate = () => {
        const template = 'Name,SKU,Barcode,Category,Price,Cost,Stock,Reorder Level,Supplier,Warehouse\n"Sample Product","SKU-001","8901234567890","Electronics",99.99,59.99,50,10,"Global Tech Components","Main Warehouse"';
        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'product_import_template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    if (!isOpen) return null;

    const validCount = parsedProducts.filter(p => p.isValid).length;
    const invalidCount = parsedProducts.filter(p => !p.isValid).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Upload className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Bulk Import Products</h2>
                            <p className="text-xs text-muted-foreground">Upload a CSV file to add multiple products</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                    {parsedProducts.length === 0 ? (
                        <>
                            {/* Upload Area */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
                                    }`}
                            >
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-foreground font-medium mb-2">Drop CSV file here or click to browse</p>
                                <p className="text-sm text-muted-foreground mb-4">Supports .csv files with product data</p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    className="hidden"
                                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Select File
                                </button>
                            </div>

                            {/* Template Download */}
                            <div className="mt-4 flex items-center justify-center">
                                <button
                                    onClick={downloadTemplate}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    Download CSV Template
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Preview Stats */}
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm">
                                    <Check className="w-4 h-4" />
                                    {validCount} valid
                                </div>
                                {invalidCount > 0 && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        {invalidCount} with errors
                                    </div>
                                )}
                                <span className="text-sm text-muted-foreground ml-auto">{fileName}</span>
                            </div>

                            {/* Preview Table */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-[300px]">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Status</th>
                                                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Name</th>
                                                <th className="px-3 py-2 text-left text-xs text-muted-foreground">SKU</th>
                                                <th className="px-3 py-2 text-left text-xs text-muted-foreground">Category</th>
                                                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Price</th>
                                                <th className="px-3 py-2 text-right text-xs text-muted-foreground">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {parsedProducts.map((p, i) => (
                                                <tr key={i} className={p.isValid ? '' : 'bg-red-500/5'}>
                                                    <td className="px-3 py-2">
                                                        {p.isValid ? (
                                                            <Check className="w-4 h-4 text-purple-400" />
                                                        ) : (
                                                            <AlertTriangle className="w-4 h-4 text-red-400" />
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-foreground">{p.name || '-'}</td>
                                                    <td className="px-3 py-2 text-muted-foreground font-mono text-xs">{p.sku}</td>
                                                    <td className="px-3 py-2 text-muted-foreground">{p.category}</td>
                                                    <td className="px-3 py-2 text-right text-foreground">₹{p.price.toFixed(2)}</td>
                                                    <td className="px-3 py-2 text-right text-muted-foreground">{p.stock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Reset */}
                            <button
                                onClick={() => { setParsedProducts([]); setFileName(''); }}
                                className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Choose different file
                            </button>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    {parsedProducts.length > 0 && (
                        <button
                            onClick={handleImport}
                            disabled={validCount === 0}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Upload className="w-4 h-4" />
                            Import {validCount} Products
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
