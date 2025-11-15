import { Suspense } from 'react';
import SuccessContent from './SuccessContent';

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="page-content">
        <section className="page-hero">
          <h1>Processing...</h1>
          <p>Please wait...</p>
        </section>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

