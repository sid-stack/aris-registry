import { useState } from 'react';

const faqs = [
  {
    question: 'What is BidSmith?',
    answer:
      'BidSmith is an AI-powered proposal compliance and generation engine designed for federal contractors. It automates the extraction of requirements, identifies compliance traps, and drafts proposal content.',
  },
  {
    question: 'How does the pricing work?',
    answer:
      'We offer three tiers: Starter ($29/mo), Growth ($199/mo), and Pilot ($2,500 one-time). Each tier comes with a set number of AI calls and features. Enterprise plans are available for larger teams.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We use enterprise-grade encryption and do not train our models on your proprietary data without explicit permission. All processing is stateless where possible.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. You can cancel your subscription at any time from your dashboard. Your access will continue until the end of your current billing period.',
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="bg-white dark:bg-gray-900 py-24 sm:py-32" id="faq">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10 dark:divide-white/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 dark:text-white">
            Frequently asked questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10 dark:divide-white/10">
            {faqs.map((faq, index) => (
              <div key={faq.question} className="pt-6">
                <dt>
                  <button
                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    className="flex w-full items-start justify-between text-left text-gray-900 dark:text-white focus:outline-none"
                    aria-expanded={openIndex === index}
                  >
                    <span className="text-base font-semibold leading-7">{faq.question}</span>
                    <span className="ml-6 flex h-7 items-center">
                      {openIndex === index ? (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18 12H6" />
                        </svg>
                      ) : (
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                        </svg>
                      )}
                    </span>
                  </button>
                </dt>
                {openIndex === index && (
                  <dd className="mt-2 pr-12">
                    <p className="text-base leading-7 text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}