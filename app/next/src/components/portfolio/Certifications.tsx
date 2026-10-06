import type { Certification } from "@/lib/types";
export function Certifications({ items }: { items: Certification[] }) {
  return (
    <section id="certifications">
      <h2>Knowledge, backed by credentials.</h2>
      <p className="section-intro">
        Certifications across cloud architecture, AI infrastructure, development and business
        communication.
      </p>
      <div className="cert-ledger">
        {items.map((c, i) => (
          <article className="credential" key={i}>
            <div className="credential-seal">{c.seal}</div>
            <div>
              <h3>{c.title}</h3>
              <p>{c.description}</p>
              <small>
                {c.issuer}
                {c.code ? " · " + c.code : ""}
              </small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
