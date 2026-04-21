import ResumeTemplateBase from "./ResumeTemplateBase";

const styles = {
  wrapper: "bg-white text-slate-900",
  name: "text-slate-900",
  contact: "rounded-md border border-slate-200 bg-white text-zinc-700 shadow-[0_1px_0_rgba(15,23,42,0.03)]",
  heading: "border-slate-300 text-slate-700",
  headerRule: "border-slate-300",
  printName: "text-slate-900",
  printContact: "text-zinc-600",
  text: "text-zinc-700",
  subHeading: "text-slate-900",
  subMeta: "text-zinc-600",
  bullet: "text-zinc-600",
  block: "border-slate-200 bg-white",
  addButton: "border-slate-400 text-zinc-700 hover:bg-slate-100",
  removeButton: "border-rose-200 text-rose-700 hover:bg-rose-50",
  mutedButton: "text-zinc-600 hover:bg-slate-100",
};

export default function ModernTemplate(props) {
  return <ResumeTemplateBase {...props} styles={styles} variant="modern" />;
}
