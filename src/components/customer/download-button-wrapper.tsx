'use client'

import React from 'react'

interface DownloadButtonWrapperProps {
    children: React.ReactNode
}

export function DownloadButtonWrapper({ children }: DownloadButtonWrapperProps) {
    const handleStopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    return (
        <div onClick={handleStopPropagation} className="inline-block">
            {children}
        </div>
    )
}
