import { useState } from "react";
import { Inference } from "./types";

// Add new JSONViewer component
export default function JSONViewer({data }: {data: Inference }) {
    const [expanded, setExpanded] = useState<Set<string>>(() => {
        // Initialize with only object paths expanded (not arrays)
        const allPaths = new Set<string>();

        const addPaths = (value: Inference, path: string) => {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                allPaths.add(path);
                Object.entries(value).forEach(([key, val]) => addPaths(val, `${path}.${key}`));
            }
        };

        addPaths(data, 'root');
        return allPaths;
    });

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expanded);
        if (expanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpanded(newExpanded);
    };

    const renderValue = (value: Inference, path: string, indent: number = 0): JSX.Element => {
        if (Array.isArray(value)) {
            const isExpanded = expanded.has(path);
            return (
                <div style={{ marginLeft: `${indent}px` }}>
                    <span
                        onClick={() => toggleExpand(path)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        {isExpanded ? '▼' : '▶'} [{value.length}]
                    </span>
                    {isExpanded && (
                        <div>
                            {value.map((item, i) => (
                                <div key={i}>
                                    {renderValue(item, `${path}.${i}`, indent + 20)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        } else if (typeof value === 'object' && value !== null) {
            const isExpanded = expanded.has(path);
            return (
                <div style={{ marginLeft: `${indent}px` }}>
                    <span
                        onClick={() => toggleExpand(path)}
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                    >
                        {isExpanded ? '▼' : '▶'} {'{...}'}
                    </span>
                    {isExpanded && (
                        <div>
                            {Object.entries(value).map(([key, val]) => (
                                <div key={key}>
                                    <span style={{ color: '#7a3e9d' }}>{key}</span>:
                                    {renderValue(val, `${path}.${key}`, indent + 20)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }
        return (
            <span style={{
                marginLeft: `${indent}px`,
                color: typeof value === 'string' ? '#690' : '#905'
            }}>
                {JSON.stringify(value)}
            </span>
        );
    };

    return (
        <div className="json-viewer font-mono text-sm">
            {renderValue(data, 'root')}
        </div>
    );
};