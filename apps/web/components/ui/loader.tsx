import React from "react";

export const Loader = () => {
    return (
        <div className="flex items-center justify-center p-20">
            <div className="loader">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
            </div>
        </div>
    );
};
