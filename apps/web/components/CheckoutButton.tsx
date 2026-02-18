"use client";

import { useState } from "react";
import { toast } from "sonner"; // Assuming sonner or similar is used, or just console/alert fallback

export const CheckoutButton = () => {
    const [loading, setLoading] = useState(false);

    const onSubscribe = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/checkout", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to create checkout session");
            }

            const data = await response.json();
            window.location.href = data.url;
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={onSubscribe}
            disabled={loading}
            className="mt-4 block w-full text-center bg-white text-blue-600 py-2 rounded-lg font-bold hover:bg-zinc-100 transition-all disabled:opacity-50"
        >
            {loading ? "Processing..." : "Upgrade for $99/mo"}
        </button>
    );
}
