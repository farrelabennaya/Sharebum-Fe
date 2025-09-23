import React from "react";
import { Card } from "./ui/Card";
import MetaBar from "./AlbumHeader/MetaBar";
import TitleEditor from "./AlbumHeader/TitleEditor";
import LinkBox from "./AlbumHeader/LinkBox";
import VisibilityControl from "./AlbumHeader/VisibilityControl";
import PasswordControl from "./AlbumHeader/PasswordControl";
import PasswordModal from "./AlbumHeader/PasswordModal";

export default function AlbumHeader({
  album,
  rename,
  onTitleChange,
  onSaveRename,
  onSetVisibility,
  onSetPassword,
  onAskDelete,
  titleRef,
}) {
  const [showPass, setShowPass] = React.useState(false);

  return (
    <>
      <PasswordModal
        open={showPass}
        onClose={() => setShowPass(false)}
        passwordProtected={!!album?.password_protected}
        onSetPassword={onSetPassword}
      />

      <Card className="p-4 md:p-5 space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {/* <h3 className="text-lg font-semibold text-white">Pengaturan Album</h3> */}
            <p className="text-sm text-zinc-500 mt-1">
              Kelola judul, akses, dan pengaturan album
            </p>
          </div>

          <MetaBar
            createdAt={album?.created_at}
            onAskDelete={onAskDelete}
          />
        </div>

        <Divider />

        {/* Content Grid */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <TitleEditor
              rename={rename}
              onTitleChange={onTitleChange}
              onSaveRename={onSaveRename}
              titleRef={titleRef}
            />
            <LinkBox slug={album?.slug} />
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <VisibilityControl
              visibility={album?.visibility ?? "private"}
              onSetVisibility={onSetVisibility}
            />
            <PasswordControl
              passwordProtected={!!album?.password_protected}
              onOpenModal={() => setShowPass(true)}
            />
          </div>
        </div>
      </Card>
    </>
  );
}

function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-zinc-200/70 to-transparent" />
  );
}
