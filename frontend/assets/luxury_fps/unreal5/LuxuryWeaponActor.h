#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "LuxuryWeaponActor.generated.h"

class UStaticMeshComponent;
class UNiagaraComponent;
class USoundBase;

/**
 * AURUM-IX Luxury Plasma Railgun Actor for Unreal Engine 5.
 * Features socket attachment, procedural recoil impulse, and Niagara VFX triggers.
 */
UCLASS()
class ALuxuryWeaponActor : public AActor
{
	GENERATED_BODY()
	
public:	
	ALuxuryWeaponActor();

protected:
	virtual void BeginPlay() override;

public:	
	virtual void Tick(float DeltaTime) override;

	UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Weapon|Mesh")
	UStaticMeshComponent* WeaponMesh;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon|Sockets")
	FName MuzzleSocketName = TEXT("MuzzleSocket");

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon|VFX")
	UNiagaraComponent* PlasmaMuzzleVFX;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon|Audio")
	USoundBase* FireSound;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon|Stats")
	float BaseDamage = 95.0f;

	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Weapon|Stats")
	float MaxRange = 15000.0f;

	UFUNCTION(BlueprintCallable, Category = "Weapon|Actions")
	void FireWeapon(APawn* InstigatorPawn);

	UFUNCTION(BlueprintCallable, Category = "Weapon|Actions")
	void SetAimDownSights(bool bAiming);

private:
	bool bIsAiming = false;
};
