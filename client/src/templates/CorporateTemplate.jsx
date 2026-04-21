import ResumeTemplateBase from "./ResumeTemplateBase";

const styles = {
  wrapper: "bg-white text-slate-900",
  name: "text-blue-950 uppercase tracking-[0.04em] text-[30px]",
  contact: "text-slate-600",
  heading: "border-blue-400 text-blue-900",
  headerRule: "border-blue-400",
  printName: "text-blue-950 uppercase tracking-[0.04em]",
  printContact: "text-slate-700",
  text: "text-slate-700",
  subHeading: "text-blue-950",
  subMeta: "text-blue-900",
  bullet: "text-blue-900",
  block: "border-blue-100 bg-slate-50",
  addButton: "border-blue-300 text-blue-900 hover:bg-blue-50",
  removeButton: "border-rose-200 text-rose-700 hover:bg-rose-50",
  mutedButton: "text-blue-900 hover:bg-blue-50",
};

export default function CorporateTemplate(props) {
  return <ResumeTemplateBase {...props} styles={styles} variant="corporate" />;
}
