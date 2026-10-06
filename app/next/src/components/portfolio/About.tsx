import type { Profile, Journey } from "@/lib/types";
export function About({ profile, education }: { profile: Profile; education: Journey[] }) {
  return (
    <section id="about">
      <h2>Build. Architect. Teach.</h2>
      <div className="about-layout">
        <div>
          {profile.about.map((p, i) => (
            <p key={i} className={i === 0 ? "about-lead" : ""}>
              {p}
            </p>
          ))}
        </div>
        <div>
          <dl className="facts">
            <div>
              <dt>Based in</dt>
              <dd>{profile.location}</dd>
            </div>
            {education.slice(0, 2).map((e) => (
              <div key={e.title}>
                <dt>{e.label}</dt>
                <dd>{e.title}</dd>
              </div>
            ))}
            <div>
              <dt>Specialization</dt>
              <dd>Cloud & Full-stack</dd>
            </div>
          </dl>
          <div className="about-note">
            <p>
              Architecture is where business goals meet engineering decisions. I connect both
              perspectives through technical expertise, practical development and cloud experience.
            </p>
          </div>
        </div>
      </div>
      <div className="about-concept">
        {[
          [
            "Architect.",
            "Connect business requirements with scalable cloud design.",
            "AWS · Infrastructure · Security",
          ],
          [
            "Build.",
            "Create full-stack products grounded in real workflows.",
            "Frontend · Backend · Data",
          ],
          [
            "Teach.",
            "Make complex systems understandable through practice.",
            "Cloud training · Clear communication",
          ],
        ].map(([title, text, tools]) => (
          <div key={title}>
            <strong>{title}</strong>
            <p>{text}</p>
            <span>{tools}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
