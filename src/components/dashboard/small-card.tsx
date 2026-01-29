import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface SmallCardProps {
  title: string;
  value: string;
  description?: string;
}

export const SmallCard = ({ title, value, description }: SmallCardProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
