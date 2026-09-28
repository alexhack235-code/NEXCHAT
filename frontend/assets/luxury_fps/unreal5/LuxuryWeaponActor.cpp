#include "LuxuryWeaponActor.h"
#include "Components/StaticMeshComponent.h"
#include "Kismet/GameplayStatics.h"
#include "DrawDebugHelpers.h"

ALuxuryWeaponActor::ALuxuryWeaponActor()
{
	PrimaryActorTick.bCanEverTick = true;

	WeaponMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("WeaponMesh"));
	RootComponent = WeaponMesh;
	WeaponMesh->SetCollisionProfileName(TEXT("NoCollision"));
}

void ALuxuryWeaponActor::BeginPlay()
{
	Super::BeginPlay();
}

void ALuxuryWeaponActor::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
}

void ALuxuryWeaponActor::FireWeapon(APawn* InstigatorPawn)
{
	if (!InstigatorPawn) return;

	APlayerController* PC = Cast<APlayerController>(InstigatorPawn->GetController());
	if (!PC) return;

	FVector CameraLocation;
	FRotator CameraRotation;
	PC->GetPlayerViewPoint(CameraLocation, CameraRotation);

	FVector TraceEnd = CameraLocation + (CameraRotation.Vector() * MaxRange);

	FHitResult HitResult;
	FCollisionQueryParams QueryParams;
	QueryParams.AddIgnoredActor(this);
	QueryParams.AddIgnoredActor(InstigatorPawn);

	bool bHit = GetWorld()->LineTraceSingleByChannel(HitResult, CameraLocation, TraceEnd, ECC_Visibility, QueryParams);

	if (FireSound)
	{
		UGameplayStatics::PlaySoundAtLocation(this, FireSound, GetActorLocation());
	}

	if (bHit)
	{
		AActor* HitActor = HitResult.GetActor();
		if (HitActor)
		{
			UGameplayStatics::ApplyPointDamage(HitActor, BaseDamage, CameraRotation.Vector(), HitResult, InstigatorPawn->GetController(), this, nullptr);
		}
	}
}

void ALuxuryWeaponActor::SetAimDownSights(bool bAiming)
{
	bIsAiming = bAiming;
}
