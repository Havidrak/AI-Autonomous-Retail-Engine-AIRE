export default function AvatarImage({ avatarUrl, large = false }) {
  if (avatarUrl) {
    return (
      <div className={`avatar-ring${large ? ' large' : ''}`}>
        <img
          className={`avatar-photo${large ? ' large' : ''}`}
          src={avatarUrl}
          alt="Profile"
          referrerPolicy="no-referrer"
        />
      </div>
    )
  }

  return (
    <div className={`avatar-ring${large ? ' large' : ''}`}>
      <div className={`avatar-core${large ? ' large' : ''}`} />
    </div>
  )
}
