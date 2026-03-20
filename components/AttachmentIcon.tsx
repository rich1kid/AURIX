
import React from 'react';

const AttachmentIcon: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32a1.5 1.5 0 1 1-2.121-2.121l10.517-10.517m.903-3.328A7 7 0 0 0 5.688 12.312L13.137 19.76a5 5 0 1 1-7.07-7.07l1.415-1.414" />
        </svg>
    );
};

export default AttachmentIcon;
