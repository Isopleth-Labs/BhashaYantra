import { useState } from "react";
import { ArrowLeft, Building2, Check, CreditCard, LockKeyhole, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BILLING_RELEASE_STATUS, DEVELOPMENT_PLAN_CATALOG, type PlanId } from "@/domain/billing/plan-catalog";

export function PricingWorkspace({ onBack }: { readonly onBack: () => void }) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("exam-90");
  const selected = DEVELOPMENT_PLAN_CATALOG.find((plan) => plan.id === selectedPlan) ?? DEVELOPMENT_PLAN_CATALOG[1];

  return (
    <section className="pricing-page">
      <header className="pricing-hero">
        <button type="button" className="pricing-back" onClick={onBack}><ArrowLeft /> Back to settings</button>
        <div className="pricing-hero-copy">
          <span className="page-eyebrow"><Sparkles /> BHASHAYANTRA PRO</span>
          <h1>One serious workspace for typing, exams, and stenography.</h1>
          <p>Select the preparation window that fits your goal. Your current development build remains fully unlocked while secure billing is completed.</p>
          <div className="pricing-trust"><span><ShieldCheck /> Offline-first core</span><span><LockKeyhole /> Secure checkout planned</span><span><Zap /> Instant plan preview</span></div>
        </div>
        <div className="pricing-status"><span>{BILLING_RELEASE_STATUS.label}</span><strong>No payment collected</strong><small>Prices shown below are introductory hypotheses and may change before launch.</small></div>
      </header>

      <div className="pricing-content">
        <div className="pricing-plans" role="radiogroup" aria-label="BhashaYantra plans">
          {DEVELOPMENT_PLAN_CATALOG.map((plan) => (
            <button type="button" role="radio" aria-checked={selectedPlan === plan.id} key={plan.id} className={selectedPlan === plan.id ? "pricing-plan selected" : "pricing-plan"} onClick={() => setSelectedPlan(plan.id)}>
              <span className="plan-radio"><i>{selectedPlan === plan.id && <Check />}</i>{plan.badge && <b>{plan.badge}</b>}</span>
              <span className="plan-name">{plan.id === "institution" ? <Building2 /> : <Sparkles />}<strong>{plan.name}</strong></span>
              <span className="plan-price"><strong>{plan.priceLabel}</strong><small>{plan.cadence}</small></span>
              <p>{plan.description}</p>
              <ul>{plan.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul>
            </button>
          ))}
        </div>

        <aside className="checkout-preview">
          <div className="checkout-title"><CreditCard /><span><small>ORDER PREVIEW</small><strong>{selected.name}</strong></span></div>
          <dl><div><dt>Plan</dt><dd>{selected.name}</dd></div><div><dt>Billing</dt><dd>{selected.cadence}</dd></div><div><dt>Preview total</dt><dd>{selected.priceLabel}</dd></div></dl>
          <div className="checkout-divider" />
          <div className="checkout-note"><LockKeyhole /><span><strong>Checkout is intentionally locked</strong><small>{BILLING_RELEASE_STATUS.message}</small></span></div>
          <Button size="lg" disabled={!BILLING_RELEASE_STATUS.purchasable}>Continue to secure checkout</Button>
          <button type="button" className="checkout-change" onClick={onBack}>Keep using the development build</button>
        </aside>
      </div>

      <section className="pricing-comparison">
        <div><span className="page-eyebrow">WHAT PRO UNLOCKS AT LAUNCH</span><h2>More than a typing tutor.</h2></div>
        <div className="comparison-grid"><span><b>2,820</b><small>layout-specific exercises</small></span><span><b>18</b><small>exam simulation profiles</small></span><span><b>6</b><small>ready keyboard layouts</small></span><span><b>100%</b><small>offline typing core</small></span></div>
      </section>
    </section>
  );
}
