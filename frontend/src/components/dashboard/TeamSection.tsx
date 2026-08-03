import { teamMembers } from "../../data/dashboardData";

function TeamSection() {
  return (
    <section className="mx-auto mt-5 w-[90%] max-w-6xl rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-5">
        <div>
          <p className="font-semibold text-blue-600">👷‍♂️ TEAM MEMBERS</p>

          <h2 className="font-bold">Software Design Group 20</h2>
        </div>

        <span className="rounded-2xl bg-blue-50 px-3 py-2 text-blue-600">
          {teamMembers.length} Students
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5 px-3 py-3 md:grid-cols-2 xl:grid-cols-4">
        {teamMembers.map((member) => (
          <article
            key={member.name}
            className="flex items-center justify-center gap-4 rounded-2xl border border-slate-100 bg-blue-50 px-3 py-4"
          >
            <span className="rounded-full bg-blue-600 px-3 py-3 font-bold text-white">
              {member.initials}
            </span>

            <div>
              <p className="font-bold">{member.name}</p>
              <p className="text-sm text-slate-600">{member.role}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TeamSection;
