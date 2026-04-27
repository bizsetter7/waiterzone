'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useMobile } from '@/hooks/useMobile';

interface StickyWrapperProps {
    children: React.ReactNode;
    offsetTop?: number;
    className?: string;
    isInternal?: boolean; // New prop for dual-sticky behavior
    zIndex?: number; // [Fix] User-defined Z-Index support
}

/**
 * High-End Smooth Follower Wrapper (v4 - Dual Sticky Edition)
 * - Simple mode: Follows top (for side banners)
 * - Internal mode: Smartly follows bottom on scroll down, top on scroll up
 */
export const StickyWrapper = ({
    children,
    offsetTop = 56,
    className = "",
    isInternal = false,
    zIndex = 50
}: StickyWrapperProps) => {
    const isMobile = useMobile();
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [yOffset, setYOffset] = useState(0);
    const yOffsetRef = useRef(0);
    const requestRef = useRef<number | null>(null);

    useEffect(() => {
        if (isMobile) {
            setYOffset(0);
            return;
        }

        const handleScroll = () => {
            const wrapper = wrapperRef.current;
            const parent = wrapper?.parentElement;
            if (!wrapper || !parent) return;

            // 1. Fundamental dimensions
            const scrollY = window.scrollY;
            const viewportHeight = window.innerHeight;
            const wrapperHeight = wrapper.offsetHeight;
            const parentRect = parent.getBoundingClientRect();
            const parentHeight = parent.offsetHeight;

            // Calculate current relative position
            // parentRect.top is the distance from viewport top to parent top
            const parentTopInViewport = parentRect.top;

            let targetY = yOffsetRef.current;

            // Simple Mode: Just follow the top with offset
            if (wrapperHeight + offsetTop < viewportHeight || !isInternal) {
                targetY = offsetTop - parentTopInViewport;
            }
            // Dual Sticky Mode: Handle taller-than-viewport items
            else {
                const currentScrollY = window.scrollY;
                const prevS = (wrapperRef as any)._prevS || 0;
                const isDown = currentScrollY > prevS;
                (wrapperRef as any)._prevS = currentScrollY;

                if (isDown) {
                    const bLimit = viewportHeight - wrapperHeight - parentTopInViewport - 20;
                    targetY = Math.max(targetY, bLimit);
                } else {
                    const tLimit = offsetTop - parentTopInViewport;
                    targetY = Math.min(targetY, tLimit);
                }
            }

            // Boundary Check: Never leave parent area
            // Ensure we don't go above the parent and stay within parent bounds
            const maxAllowedY = parentHeight - wrapperHeight;
            targetY = Math.max(0, Math.min(targetY, maxAllowedY));

            // Smoothness Guard
            if (Math.abs(yOffsetRef.current - targetY) > 0.01) {
                yOffsetRef.current = targetY;
                setYOffset(targetY);
            }
        };

        const onScroll = () => {
            if (requestRef.current !== null) {
                cancelAnimationFrame(requestRef.current);
            }
            requestRef.current = requestAnimationFrame(handleScroll);
        };

        window.addEventListener('scroll', onScroll, { passive: true });

        // Resize observer to handle dynamic content height changes
        const ro = new ResizeObserver(() => {
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
            requestRef.current = requestAnimationFrame(handleScroll);
        });

        if (wrapperRef.current) ro.observe(wrapperRef.current);
        if (document.body) ro.observe(document.body);

        // Initial call
        handleScroll();

        return () => {
            window.removeEventListener('scroll', onScroll);
            if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
            ro.disconnect();
        };
    }, [isMobile, offsetTop, isInternal]);

    const followerStyle: React.CSSProperties = isMobile ? {} : {
        transform: `translateY(${yOffset}px)`,
        transition: 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
        willChange: 'transform',
        zIndex: zIndex
    };

    return (
        <div
            ref={wrapperRef}
            className={`relative w-full ${className}`}
            style={followerStyle}
        >
            {children}
        </div>
    );
};
