import type { Journey as Item } from "@/lib/types";
export function Journey({ experience, education }: { experience: Item[]; education: Item[] }) {
  return (
    <section id="experience">
      <h2>Learning through building.</h2>
      <div className="timeline">
        {[
          ["Experience", experience],
          ["Education", education],
        ].map(([title, list]) => (
          <div key={title as string}>
            <h3>{title as string}</h3>
            {(list as Item[]).map((item, i) => (
              <article key={i}>
                <small>{item.label}</small>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
