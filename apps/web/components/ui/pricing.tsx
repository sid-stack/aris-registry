"use client";
import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CheckCircleIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import { motion, Transition } from 'framer-motion';

type FREQUENCY = 'monthly' | 'yearly';
const frequencies: FREQUENCY[] = ['monthly', 'yearly'];

export interface Plan {
    name: string;
    info: string;
    price: {
        monthly: number;
        yearly: number;
    };
    features: {
        text: string;
        tooltip?: string;
    }[];
    btn: {
        text: string;
        href: string;
    };
    plan_id?: string;  // if set, clicking the button triggers Stripe checkout
    highlighted?: boolean;
}

interface PricingSectionProps extends React.ComponentProps<'div'> {
    plans: Plan[];
    heading: string;
    description?: string;
    onCheckout?: (planId: string, frequency: FREQUENCY) => void;
}

export function PricingSection({
    plans,
    heading,
    description,
    onCheckout,
    ...props
}: PricingSectionProps) {
    const [frequency, setFrequency] = React.useState<'monthly' | 'yearly'>(
        'monthly',
    );

    return (
        <div
            className={cn(
                'flex w-full flex-col items-center justify-center space-y-5 p-4',
                props.className,
            )}
            {...props}
        >
            <div className="mx-auto max-w-xl space-y-2">
                <h2 className="text-center text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl text-white">
                    {heading}
                </h2>
                {description && (
                    <p className="text-muted-foreground text-center text-sm md:text-base text-zinc-400">
                        {description}
                    </p>
                )}
            </div>
            <PricingFrequencyToggle
                frequency={frequency}
                setFrequency={setFrequency}
            />
            <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
                {plans.map((plan) => (
                    <PricingCard plan={plan} key={plan.name} frequency={frequency} onCheckout={onCheckout ? (planId) => onCheckout(planId, frequency) : undefined} />
                ))}
            </div>
        </div>
    );
}

type PricingFrequencyToggleProps = React.ComponentProps<'div'> & {
    frequency: FREQUENCY;
    setFrequency: React.Dispatch<React.SetStateAction<FREQUENCY>>;
};

export function PricingFrequencyToggle({
    frequency,
    setFrequency,
    ...props
}: PricingFrequencyToggleProps) {
    return (
        <div
            className={cn(
                'bg-white/10 mx-auto flex w-fit rounded-full border border-white/10 p-1',
                props.className,
            )}
            {...props}
        >
            {frequencies.map((freq) => (
                <button
                    key={freq}
                    onClick={() => setFrequency(freq)}
                    className="relative px-4 py-1 text-sm capitalize text-zinc-400 transition-colors hover:text-white"
                >
                    <span className={cn("relative z-10", frequency === freq && "text-black font-medium")}>{freq}</span>
                    {frequency === freq && (
                        <motion.span
                            layoutId="frequency"
                            transition={{ type: 'spring', duration: 0.4 }}
                            className="bg-white absolute inset-0 z-0 rounded-full"
                        />
                    )}
                </button>
            ))}
        </div>
    );
}

type PricingCardProps = React.ComponentProps<'div'> & {
    plan: Plan;
    frequency?: FREQUENCY;
    onCheckout?: (planId: string) => void;  // frequency already baked in by PricingSection
};

export function PricingCard({
    plan,
    className,
    frequency = frequencies[0],
    onCheckout,
    ...props
}: PricingCardProps) {
    const [loading, setLoading] = React.useState(false);

    const handleClick = async (e: React.MouseEvent) => {
        if (plan.plan_id && onCheckout) {
            e.preventDefault();
            setLoading(true);
            try {
                await onCheckout(plan.plan_id);
            } finally {
                setLoading(false);
            }
        }
    };
    return (
        <div
            key={plan.name}
            className={cn(
                'relative flex w-full flex-col rounded-xl border border-white/10 bg-zinc-900/50 p-6',
                plan.highlighted && 'border-purple-500/50',
                className,
            )}
            {...props}
        >
            {plan.highlighted && (
                <BorderTrail
                    style={{
                        boxShadow:
                            '0px 0px 60px 30px rgba(168, 85, 247, 0.2), 0 0 100px 60px rgba(168, 85, 247, 0.1)',
                    }}
                    size={100}
                />
            )}
            <div className="relative">
                <div className="absolute top-0 right-0 z-10 flex items-center gap-2">
                    {plan.highlighted && (
                        <p className="bg-purple-500 text-white flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                            <StarIcon className="h-3 w-3 fill-current" />
                            Popular
                        </p>
                    )}
                    {frequency === 'yearly' && (
                        <p className="bg-green-500 text-white flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                            {Math.round(
                                ((plan.price.monthly * 12 - plan.price.yearly) /
                                    plan.price.monthly /
                                    12) *
                                100,
                            )}
                            % OFF
                        </p>
                    )}
                </div>

                <div className="text-lg font-bold text-white mb-2">{plan.name}</div>
                <p className="text-zinc-400 text-sm mb-6 h-10">{plan.info}</p>
                <h3 className="flex items-end gap-1 mb-6">
                    <span className="text-3xl font-bold text-white">${plan.price[frequency]}</span>
                    <span className="text-zinc-500 text-sm mb-1">
                        {plan.name !== 'Free'
                            ? '/' + (frequency === 'monthly' ? 'mo' : 'yr')
                            : ''}
                    </span>
                </h3>
            </div>

            <div className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <CheckCircleIcon className="text-purple-400 h-5 w-5 mt-0.5 shrink-0" />
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <p
                                        className={cn(
                                            "text-sm text-zinc-300",
                                            feature.tooltip &&
                                            'cursor-help border-b border-dashed border-zinc-600'
                                        )}
                                    >
                                        {feature.text}
                                    </p>
                                </TooltipTrigger>
                                {feature.tooltip && (
                                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-white">
                                        <p>{feature.tooltip}</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                {plan.plan_id && onCheckout ? (
                    <Button
                        onClick={handleClick}
                        disabled={loading}
                        className={cn(
                            "w-full rounded-full font-semibold transition-all h-10",
                            plan.highlighted
                                ? "bg-white text-black hover:bg-zinc-200"
                                : "bg-white/10 text-white hover:bg-white/20 border-white/5"
                        )}
                    >
                        {loading ? 'Redirecting...' : plan.btn.text}
                    </Button>
                ) : (
                    <Button
                        className={cn(
                            "w-full rounded-full font-semibold transition-all h-10",
                            plan.highlighted
                                ? "bg-white text-black hover:bg-zinc-200"
                                : "bg-white/10 text-white hover:bg-white/20 border-white/5"
                        )}
                        asChild
                    >
                        <Link href={plan.btn.href}>{plan.btn.text}</Link>
                    </Button>
                )}
            </div>
        </div>
    );
}


type BorderTrailProps = {
    className?: string;
    size?: number;
    transition?: Transition;
    delay?: number;
    onAnimationComplete?: () => void;
    style?: React.CSSProperties;
};

export function BorderTrail({
    className,
    size = 60,
    transition,
    delay,
    onAnimationComplete,
    style,
}: BorderTrailProps) {
    const BASE_TRANSITION = {
        repeat: Infinity,
        duration: 5,
        ease: 'linear',
    };

    return (
        <div className='pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]'>
            <motion.div
                className={cn('absolute aspect-square bg-gradient-to-tr from-purple-500 via-blue-500 to-transparent opacity-50', className)}
                style={{
                    width: size,
                    offsetPath: `rect(0 auto auto 0 round ${size}px)`,
                    ...style,
                }}
                animate={{
                    offsetDistance: ['0%', '100%'],
                }}
                transition={{
                    ...(transition ?? BASE_TRANSITION),
                    delay: delay,
                }}
                onAnimationComplete={onAnimationComplete}
            />
        </div>
    );
}
