
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg
            className={className}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="Aurix Logo"
        >
            <circle cx="50" cy="50" r="48" stroke="currentColor" strokeWidth="4" />
            <path
                d="M50 15L20 85H32.5L41.25 65H58.75L67.5 85H80L50 15ZM44.5 55L50 40L55.5 55H44.5Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default Logo;