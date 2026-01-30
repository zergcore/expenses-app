import { Label } from "../ui/label";
import { RadioGroupItem } from "../ui/radio-group";

export function ThemeOption({ id, label }: { id: string; label: string }) {
  return (
    <div className="flex items-center space-x-2">
      <RadioGroupItem value={id} id={id} />
      <Label htmlFor={id} className="cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
