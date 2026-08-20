"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { OrnamentDivider } from "./ornament-divider";
import { NAV_SECTIONS, type SectionId } from "./nav-sections";

export function Header({
  activeSection,
  onSectionChange,
}: {
  activeSection: SectionId;
  onSectionChange: (id: SectionId) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-3">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            className="md:hidden"
            render={<Button variant="outline" size="icon" aria-label="Open menu" />}
          >
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-baseline gap-2">
                <span className="font-heading text-xl text-primary">ዝማሬ</span>
                <span className="text-xs font-semibold tracking-widest text-muted-foreground">
                  ZIMARE
                </span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-2 pb-4">
              {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
                <Button
                  key={id}
                  variant={activeSection === id ? "secondary" : "ghost"}
                  className="justify-start gap-2"
                  onClick={() => {
                    onSectionChange(id);
                    setMobileOpen(false);
                  }}
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <button
          type="button"
          onClick={() => onSectionChange("tuner")}
          className="mr-auto flex items-baseline gap-2 transition-opacity hover:opacity-80"
        >
          <span className="font-heading text-2xl text-primary">ዝማሬ</span>
          <span className="text-xs font-semibold tracking-widest text-muted-foreground">
            ZIMARE
          </span>
        </button>

        <Tabs
          value={activeSection}
          onValueChange={(value) => onSectionChange(value as SectionId)}
          className="hidden md:flex"
        >
          <TabsList variant="line">
            {NAV_SECTIONS.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className="gap-1.5 after:bg-primary data-active:text-primary"
              >
                <Icon className="size-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <OrnamentDivider />
    </header>
  );
}
