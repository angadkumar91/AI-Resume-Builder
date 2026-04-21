import ResumeTemplateBase from "./ResumeTemplateBase";

const styles = {
  wrapper: "bg-white text-slate-900",
  name: "text-slate-900 tracking-tight",
  contact: "text-slate-600",
  heading: "border-slate-300 text-slate-800",
  headerRule: "border-slate-300",
  printName: "text-slate-900",
  printContact: "text-slate-700",
  text: "text-slate-700",
  subHeading: "text-slate-900",
  subMeta: "text-slate-600",
  bullet: "text-slate-600",
  block: "border-slate-200 bg-white",
  addButton: "border-slate-300 text-slate-700 hover:bg-slate-100",
  removeButton: "border-rose-200 text-rose-700 hover:bg-rose-50",
  mutedButton: "text-slate-600 hover:bg-slate-100",
};

export default function MinimalTemplate(props) {
  return <ResumeTemplateBase {...props} styles={styles} variant="minimal" />;
}
